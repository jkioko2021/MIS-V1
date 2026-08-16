<%@ Page Title="" Language="VB" MasterPageFile="~/MasterPage.master" AutoEventWireup="false" CodeFile="Risk_Register_Close.aspx.vb" Inherits="_Default" %>

<%@ OutputCache Location="None" %>
<%@ Register Assembly="AjaxControlToolkit" Namespace="AjaxControlToolkit" TagPrefix="cc1" %>
<%@ Register assembly="Telerik.Web.UI" namespace="Telerik.Web.UI" tagprefix="telerik" %>
<asp:Content ID="Content1" ContentPlaceHolderID="ContentPlaceHolder1" Runat="Server">
    <asp:UpdateProgress ID="UpdateProgress1" runat="server">
        <ProgressTemplate>
         <asp:Label ID="lblProgress" runat="server" Font-Bold="True" ForeColor="Red" 
                Text="Please Wait...." Font-Size="Medium"></asp:Label>
        </ProgressTemplate>
    </asp:UpdateProgress>
    <asp:UpdatePanel ID="UpdatePanel1" runat="server">
                <ContentTemplate>
                    <div align="center">
                    
                    <asp:Panel ID="Panel1" runat="server" BorderStyle="Solid" BorderWidth="1px" 
                        Width="1176px">
                 
                 <table style="width: 96%; margin-left: 0px;" align="center">
                                <tr>
                                    <td class="style8">
                                      <asp:Panel ID="Panel8" runat="server" BorderStyle="Solid" BorderWidth="1px" 
                            Height="100%" Width="1190px">
                            <table style="1100: ;">
                                <tr>
                                    <td align="center" bgcolor="#CCCCCC">
                                        <asp:Label ID="Label135" runat="server" Font-Bold="True" 
                                            Text="CLOSE PERIOD" Font-Size="Medium"></asp:Label>
                                    </td>
                                </tr>
                                <tr>
                                    <td align="center">
                                        <table style="width: 1132px">
                                            <tr>
                                                <td colspan="3">
                                                    <asp:Panel ID="Panel12" runat="server" Height="100%" ScrollBars="Both" 
                                                        Width="1142px">
                                                        <telerik:RadGrid ID="GDDEPART" runat="server" AllowPaging="True" 
                                                            CellSpacing="0" GridLines="None" Height="100%" PageSize="20" Skin="Simple" 
                                                            Width="100%">
                                                            <MasterTableView AutoGenerateColumns="False">
                                                                <CommandItemSettings ExportToPdfText="Export to PDF" />
                                                                <CommandItemSettings ExportToPdfText="Export to PDF" />
                                                                <RowIndicatorColumn FilterControlAltText="Filter RowIndicator column">
                                                                    <HeaderStyle Width="20px" />
                                                                </RowIndicatorColumn>
                                                                <ExpandCollapseColumn FilterControlAltText="Filter ExpandColumn column">
                                                                    <HeaderStyle Width="20px" />
                                                                </ExpandCollapseColumn>
                                                                <Columns>
                                                         
                                                                    <telerik:GridBoundColumn DataField="Depart_Code" 
                                                                        FilterControlAltText="Filter Depart_Code column" HeaderText="Depart_Code" 
                                                                        SortExpression="Depart_Code" UniqueName="Depart_Code">
                                                                    </telerik:GridBoundColumn>
                                                                    <telerik:GridBoundColumn DataField="Period_From" 
                                                                        FilterControlAltText="Filter Period_From column" HeaderText="Period_From" 
                                                                        SortExpression="Period_From" UniqueName="Period_From">
                                                                    </telerik:GridBoundColumn>
                                                                    <telerik:GridBoundColumn DataField="Period_To" 
                                                                        FilterControlAltText="Filter Period_To column" HeaderText="Period_To" 
                                                                        SortExpression="Period_To" UniqueName="Period_To">
                                                                    </telerik:GridBoundColumn>
                                                                    <telerik:GridBoundColumn DataField="Department" 
                                                                        FilterControlAltText="Filter Department column" HeaderText="Department" 
                                                                        SortExpression="Department" UniqueName="Department">
                                                                    </telerik:GridBoundColumn>
                                                                    <telerik:GridBoundColumn DataField="Risk_Owner" 
                                                                        FilterControlAltText="Filter Risk_Owner column" HeaderText="Risk_Owner" 
                                                                        SortExpression="Risk_Owner" UniqueName="Risk_Owner">
                                                                    </telerik:GridBoundColumn>
                                                                    <telerik:GridBoundColumn DataField="Champion_Name" 
                                                                        FilterControlAltText="Filter Champion_Name column" HeaderText="Champion_Name" 
                                                                        SortExpression="Champion_Name" UniqueName="Champion_Name">
                                                                    </telerik:GridBoundColumn>
                                                                    <telerik:GridBoundColumn DataField="Status" 
                                                                        FilterControlAltText="Filter Status column" HeaderText="Status" 
                                                                        SortExpression="Status" UniqueName="Status">
                                                                    </telerik:GridBoundColumn>
                                                                    <telerik:GridBoundColumn DataField="Due_Date" 
                                                                        FilterControlAltText="Filter Due_Date column" HeaderText="Due_Date" 
                                                                        SortExpression="Due_Date" UniqueName="Due_Date">
                                                                    </telerik:GridBoundColumn>
                                                                </Columns>
                                                                <EditFormSettings>
                                                                    <EditColumn FilterControlAltText="Filter EditCommandColumn column">
                                                                    </EditColumn>
                                                                </EditFormSettings>
                                                            </MasterTableView>
                                                            <ItemStyle Wrap="False" />
                                                            <PagerStyle Wrap="False" />
                                                            <FilterMenu EnableImageSprites="False">
                                                            </FilterMenu>
                                                            <HeaderContextMenu CssClass="GridContextMenu GridContextMenu_Default">
                                                            </HeaderContextMenu>
                                                        </telerik:RadGrid>
                                                    </asp:Panel>
                                                </td>
                                                <td>
                                                    &nbsp;</td>
                                            </tr>
                                            <tr>
                                                <td style="width: 1025px">
                                                    <asp:Label ID="FILE_NO" runat="server" Font-Bold="True" Font-Size="Small" 
                                                        style="font-weight: 700; color: #CC0000; background-color: #FFFFFF"></asp:Label>
                                                </td>
                                                <td style="width: 125px">
                                                    &nbsp;</td>
                                                <td style="width: 264px">
                                                    &nbsp;</td>
                                                <td>
                                                    &nbsp;</td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                                <tr>
                                    <td>
                                        <table style="width: 100%">
                                            <tr>
                                                <td align="center" bgcolor="#666666" colspan="4">
                                                    &nbsp;</td>
                                            </tr>
                                            <tr>
                                                <td align="center" style="width: 98px">
                                                    <asp:Label ID="Label182" runat="server" Text="Period From"></asp:Label>
                                                </td>
                                                <td align="center">
                                                    <telerik:RadComboBox ID="cbofrom" Runat="server" AutoPostBack="True" 
                                                        Skin="Sunset" Width="200px">
                                                    </telerik:RadComboBox>
                                                </td>
                                                <td align="center">
                                                    &nbsp;</td>
                                                <td align="center">
                                                    &nbsp;</td>
                                            </tr>
                                            <tr>
                                                <td align="center" style="height: 23px">
                                                    <asp:Label ID="Label183" runat="server" Text="Period To"></asp:Label>
                                                </td>
                                                <td align="center" style="height: 23px">
                                                    <telerik:RadComboBox ID="cboto" Runat="server" Skin="Sunset" Width="200px">
                                                    </telerik:RadComboBox>
                                                </td>
                                                <td align="center" style="height: 23px">
                                                </td>
                                                <td align="center" style="height: 23px">
                                                </td>
                                            </tr>
                                            <tr>
                                                <td align="center">
                                                    &nbsp;</td>
                                                <td align="center">
                                                    &nbsp;</td>
                                                <td align="center">
                                                    &nbsp;</td>
                                                <td align="center">
                                                    &nbsp;</td>
                                            </tr>
                                            <tr>
                                                <td align="center">
                                                    <asp:Label ID="Label184" runat="server" Text="Action"></asp:Label>
                                                </td>
                                                <td align="center">
                                                    <telerik:RadComboBox ID="cbocompl" Runat="server" Skin="Sunset" Width="200px">
                                                        <Items>
                                                            <telerik:RadComboBoxItem runat="server" />
                                                            <telerik:RadComboBoxItem runat="server" Text="Close" Value="C" />
                                                        </Items>
                                                    </telerik:RadComboBox>
                                                </td>
                                                <td align="center">
                                                    &nbsp;</td>
                                                <td align="center">
                                                    &nbsp;</td>
                                            </tr>
                                            <tr>
                                                <td align="center" style="height: 35px">
                                                    </td>
                                                <td align="center" style="height: 35px">
                                                    <telerik:RadButton ID="RadButton1" runat="server" Skin="Simple" 
                                                        style="font-weight: 700" Text="Submit" Width="150px">
                                                    </telerik:RadButton>
                                                    &nbsp;
                                                    <asp:Label ID="lblsubmit" runat="server" Font-Bold="True" Font-Size="Medium" 
                                                        ForeColor="Red"></asp:Label>
                                                </td>
                                                <td align="center" style="height: 35px">
                                                </td>
                                                <td align="center" style="height: 35px">
                                                </td>
                                            </tr>
                                            <tr>
                                                <td align="center" colspan="4">
                                                    &nbsp;</td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                                <tr>
                                    <td>
                                        &nbsp;<asp:HiddenField ID="HiddenField1" runat="server" />
                                    </td>
                                </tr>
                            </table>
                        </asp:Panel>
                                        </td>
                                </tr>
                            </table>
   </asp:Panel>
   </div>
            </ContentTemplate>
     
            </asp:UpdatePanel>
</asp:Content>


