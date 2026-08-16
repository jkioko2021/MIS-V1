<%@ Page Language="VB" AutoEventWireup="false" CodeFile="Reports.aspx.vb" Inherits="ReportViewer" %>
<%@ Register Assembly="Telerik.Web.UI" Namespace="Telerik.Web.UI" TagPrefix="telerik" %>
<%@ Register Assembly="AjaxControlToolkit" Namespace="AjaxControlToolkit" TagPrefix="cc1" %>
<%@ Register assembly="Telerik.Web.UI" namespace="Telerik.Charting" tagprefix="telerik" %>
<%@ Register Assembly="CrystalDecisions.Web, Version=13.0.2000.0, Culture=neutral, PublicKeyToken=692fbea5521e1304"
    Namespace="CrystalDecisions.Web" TagPrefix="CR" %>
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head runat="server">
    <title>.::Mis Reports::.</title>
    <script language="Javascript" type="text/javascript">
        function OpenNewWindow() {
            //            var newWind = window.open("subDoc.aspx", "subWindow", "status,menubar,height=400,width=300");
            //self.resizeTo(500, 600);
            this.window.resizeTo(500, 400);
        }
 
    </script>
</head>
<body onload="OpenNewWindow()">
    <form id="form1" runat="server">
    <telerik:RadScriptManager ID="ToolkitScriptManager1" runat="server" EnableTheming="True"></telerik:RadScriptManager>
    <div>
        <table width="100%">
                <tr>
                    <td>
                    <hr style="border-color: blue;" />
                    <asp:UpdateProgress ID="UpdateProgress1" runat="server">
                        <ProgressTemplate>
                            <asp:Image ID="Img2" runat="server" ImageUrl="~/Images/ajax-loader1.gif"></asp:Image>
                            <asp:Label ID="Label1" runat="server" Text="Please Wait...." ForeColor="Red" Font-Bold="True"></asp:Label>
                        </ProgressTemplate>
                    </asp:UpdateProgress></td>
                </tr>
                <tr>
                    <td>
                        <asp:Panel ID="Panel3" runat="server" CssClass="box1" style="background-color:ButtonHighlight; border:0px; padding:3px 5px 2px 5px;" Visible="False" Width="100%">
                            <asp:Label ID="LblErr" runat="server" Text="" ForeColor="Red" Font-Bold="true" Font-Size="Small"></asp:Label>
                        </asp:Panel>
                        <cc1:RoundedCornersExtender ID="RoundedCornersExtender1" runat="server" 
                        TargetControlID="Panel3" Corners="All" BorderColor="BlueViolet"></cc1:RoundedCornersExtender>
                    </td>
                </tr>
                <tr>
                    <td>
                        <fieldset>
                            <CR:CrystalReportViewer ID="CrystalReportViewer1" runat="server" 
                                AutoDataBind="true" EnableParameterPrompt="False" />
                        </fieldset>
                    </td>
                </tr>
                <tr>
                    <td>&nbsp;</td>
                    <td>
                        &nbsp;</td>
                </tr>
            </table>
    </div>
    </form>
</body>
</html>
