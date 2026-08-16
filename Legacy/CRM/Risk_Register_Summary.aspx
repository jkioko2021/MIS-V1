<%@ Page Title="" Language="VB" MasterPageFile="~/MasterPage.master" AutoEventWireup="false" CodeFile="Risk_Register_Summary.aspx.vb" Inherits="_Default" %>

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
                                            Text="RISK RANKING &amp; SIGNOFF" Font-Size="Medium"></asp:Label>
                                    </td>
                                </tr>
                                <tr>
                                    <td align="center">
                                        <table style="width: 1132px">
                                            <tr>
                                                <td colspan="3">
                                                    <asp:Panel ID="Panel29" runat="server">
                                                        <table style="width: 100%">
                                                            <tr>
                                                                <td style="width: 167px">
                                                                    <asp:Label ID="Label211" runat="server" Font-Bold="True" Font-Size="Small" 
                                                                        Text="PERIOD FROM"></asp:Label>
                                                                </td>
                                                                <td>
                                                                    <telerik:RadComboBox ID="cbofrom" Runat="server" AutoPostBack="True" 
                                                                        Skin="Sunset" Width="200px">
                                                                    </telerik:RadComboBox>
                                                                </td>
                                                            </tr>
                                                            <tr>
                                                                <td style="width: 167px">
                                                                    <asp:Label ID="Label212" runat="server" Font-Bold="True" Font-Size="Small" 
                                                                        Text="PERIOD TO"></asp:Label>
                                                                </td>
                                                                <td>
                                                                    <telerik:RadComboBox ID="cboto" Runat="server" Skin="Sunset" Width="200px">
                                                                    </telerik:RadComboBox>
                                                                </td>
                                                            </tr>
                                                        </table>
                                                    </asp:Panel>
                                                </td>
                                                <td>
                                                    &nbsp;</td>
                                            </tr>
                                            <tr>
                                                <td colspan="3" bgcolor="#999999">
                                                    <asp:Label ID="Label209" runat="server" Font-Bold="True" Font-Size="Small" 
                                                        Text="OVERAL TOP 10"></asp:Label>
                                                </td>
                                                <td>
                                                    &nbsp;</td>
                                            </tr>
                                            <tr>
                                                <td style="width: 1025px">
                                                    <asp:Panel ID="Panel28" runat="server" Height="100%" ScrollBars="Both" 
                                                        Width="1142px">
                                                        <telerik:RadGrid ID="GD_RISK_OVER" runat="server" AllowPaging="True" 
                                                            CellSpacing="0" GridLines="None" Height="100%" PageSize="50" Skin="Simple" 
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
                                                                <telerik:GridBoundColumn DataField="Department" 
                                                                        FilterControlAltText="Filter Department column" 
                                                                        HeaderText="Department" SortExpression="Department" 
                                                                        UniqueName="Department">
                                                                    </telerik:GridBoundColumn>
                                                                    <telerik:GridBoundColumn DataField="Risk_Title" 
                                                                        FilterControlAltText="Filter Risk_Title column" 
                                                                        HeaderText="Risk_Title" SortExpression="Risk_Title" 
                                                                        UniqueName="Risk_Title">
                                                                    </telerik:GridBoundColumn>
                                                                    <telerik:GridBoundColumn DataField="Risk_Impact" 
                                                                        FilterControlAltText="Filter Risk_Impact column" HeaderText="Risk_Impact" 
                                                                        SortExpression="Risk_Impact" UniqueName="Risk_Impact">
                                                                    </telerik:GridBoundColumn>
                                                                    <telerik:GridBoundColumn DataField="Risk_Likelihood" 
                                                                        FilterControlAltText="Filter Risk_Likelihood column" HeaderText="Likelihood" 
                                                                        SortExpression="Risk_Likelihood" UniqueName="Risk_Likelihood">
                                                                    </telerik:GridBoundColumn>
                                                                    <telerik:GridBoundColumn DataField="I_Risk_Exposure" 
                                                                        FilterControlAltText="Filter I_Risk_Exposure column" 
                                                                        HeaderText="Inh_Exposure" SortExpression="I_Risk_Exposure" 
                                                                        UniqueName="I_Risk_Exposure">
                                                                    </telerik:GridBoundColumn>
                                                                    <telerik:GridBoundColumn DataField="I_Risk_Rate" 
                                                                        FilterControlAltText="Filter I_Risk_Rate  column" HeaderText="Inh_Rate" 
                                                                        SortExpression="I_Risk_Rate" UniqueName="I_Risk_Rate">
                                                                    </telerik:GridBoundColumn>
                                                                     <telerik:GridBoundColumn DataField="Perceived_Contr_Eff" 
                                                                        FilterControlAltText="Filter Perceived_Contr_Eff  column" HeaderText="Perceived_Contr" 
                                                                        SortExpression="Perceived_Contr_Eff" UniqueName="Perceived_Contr_Eff">
                                                                    </telerik:GridBoundColumn>
                                                                      <telerik:GridBoundColumn DataField="R_Risk_Exposure" 
                                                                        FilterControlAltText="Filter R_Risk_Exposure  column" HeaderText="Res_Exposure" 
                                                                        SortExpression="R_Risk_Exposure" UniqueName="R_Risk_Exposure">
                                                                    </telerik:GridBoundColumn>
                                                                    <telerik:GridBoundColumn DataField="R_Risk_Rate" 
                                                                        FilterControlAltText="Filter R_Risk_Rate column" 
                                                                        HeaderText="Res_Rate" SortExpression="R_Risk_Rate" 
                                                                        UniqueName="R_Risk_Rate">
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
                                                <td style="width: 125px">
                                                    &nbsp;</td>
                                                <td style="width: 264px">
                                                    &nbsp;</td>
                                                <td>
                                                    &nbsp;</td>
                                            </tr>
                                            <tr>
                                                <td colspan="3" bgcolor="#999999">
                                                    <asp:Label ID="Label210" runat="server" Font-Bold="True" Font-Size="Small" 
                                                        Text="REVIEWED"></asp:Label>
                                                </td>
                                                <td>
                                                    &nbsp;</td>
                                            </tr>
                                            <tr>
                                                <td colspan="3">
                                                    <asp:Panel ID="Panel12" runat="server" Height="100%" ScrollBars="Both" 
                                                        Width="1142px">
                                                        <telerik:RadGrid ID="GDDEPART" runat="server" AllowPaging="True" 
                                                            CellSpacing="0" GridLines="None" Height="100%" PageSize="20" Skin="Simple" 
                                                            Width="100%">
                                                            <MasterTableView AutoGenerateColumns="False" DataKeyNames="Id">
                                                                <CommandItemSettings ExportToPdfText="Export to PDF" />
                                                                <CommandItemSettings ExportToPdfText="Export to PDF" />
                                                                <RowIndicatorColumn FilterControlAltText="Filter RowIndicator column">
                                                                    <HeaderStyle Width="20px" />
                                                                </RowIndicatorColumn>
                                                                <ExpandCollapseColumn FilterControlAltText="Filter ExpandColumn column">
                                                                    <HeaderStyle Width="20px" />
                                                                </ExpandCollapseColumn>
                                                                <Columns>
                                                                    <telerik:GridButtonColumn CommandName="Select" 
                                                                        FilterControlAltText="Filter Depart_Code column" HeaderText="Select" 
                                                                        Text="Select" UniqueName="Select">
                                                                        <HeaderStyle ForeColor="Blue" Width="50px" />
                                                                        <ItemStyle Width="50px" />
                                                                    </telerik:GridButtonColumn>
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
                                            <tr>
                                                <td colspan="4">
                                                    <telerik:RadTabStrip ID="RadTabStrip1" runat="server" 
                                                        MultiPageID="RadMultiPage1" SelectedIndex="0">
                                                        <Tabs>
                                                            <telerik:RadTab runat="server" PageViewID="V1" Text="Risk Register" 
                                                                Selected="True" SelectedIndex="0">
                                                            </telerik:RadTab>
                                                            <telerik:RadTab runat="server" PageViewID="V2" Text="Risk Summary">
                                                            </telerik:RadTab>
                                                            <telerik:RadTab runat="server" PageViewID="V3" Text="Top 10 Risks">
                                                            </telerik:RadTab>
                                                        </Tabs>
                                                    </telerik:RadTabStrip>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td colspan="4">
                                                    <telerik:RadMultiPage ID="RadMultiPage1" Runat="server" Width="1082px">
                                                        <telerik:RadPageView ID="V1" runat="server" Width="1136px" Selected="True">
                                                            <asp:Panel ID="Panel19" runat="server">
                                                                <table style="width: 100%">
                                                                    <tr>
                                                                        <td colspan="4">
                                                                            <asp:Panel ID="Panel20" runat="server" Height="100%" ScrollBars="Both" 
                                                                                Width="1142px">
                                                                                <telerik:RadGrid ID="GD_RISK" runat="server" AllowPaging="True" 
                                                                                    CellSpacing="0" GridLines="None" Height="100%" Skin="Simple" 
                                                                                    Width="100%">
                                                                                    <MasterTableView AutoGenerateColumns="False"  DataKeyNames="Risk_Id"> 
                                                                                        <CommandItemSettings ExportToPdfText="Export to PDF" />
                                                                                        <CommandItemSettings ExportToPdfText="Export to PDF" />
                                                                                        <RowIndicatorColumn FilterControlAltText="Filter RowIndicator column">
                                                                                            <HeaderStyle Width="20px" />
                                                                                        </RowIndicatorColumn>
                                                                                        <ExpandCollapseColumn FilterControlAltText="Filter ExpandColumn column">
                                                                                            <HeaderStyle Width="20px" />
                                                                                        </ExpandCollapseColumn>
                                                                                        <Columns>
                                                                                            <telerik:GridButtonColumn CommandName="Select" 
                                                                                                FilterControlAltText="Filter Depart_Code column" HeaderText="Select" 
                                                                                                Text="Select" UniqueName="Select">
                                                                                                <HeaderStyle ForeColor="Blue" Width="50px" />
                                                                                                <ItemStyle Width="50px" />
                                                                                            </telerik:GridButtonColumn>
                                                                                            <telerik:GridBoundColumn DataField="Risk_Id" 
                                                                                                FilterControlAltText="Filter Risk_Id column" HeaderText="Risk_Id" 
                                                                                                SortExpression="Risk_Id" UniqueName="Risk_Id">
                                                                                            </telerik:GridBoundColumn>
                                                                                            <telerik:GridBoundColumn DataField="Depart_Objective" 
                                                                                                FilterControlAltText="Filter Depart_Objective column" HeaderText="Objective" 
                                                                                                SortExpression="Depart_Objective" UniqueName="Depart_Objective">
                                                                                            </telerik:GridBoundColumn>
                                                                                            <telerik:GridBoundColumn DataField="Risk_Title" 
                                                                                                FilterControlAltText="Filter Risk_Title column" HeaderText="Risk_Title" 
                                                                                                SortExpression="Risk_Title" UniqueName="Risk_Title">
                                                                                            </telerik:GridBoundColumn>
                                                                                            <telerik:GridBoundColumn DataField="Risk_Category" 
                                                                                                FilterControlAltText="Filter Risk_Category column" HeaderText="Risk_Category" 
                                                                                                SortExpression="Risk_Category" UniqueName="Risk_Category">
                                                                                            </telerik:GridBoundColumn>
                                                                                            <telerik:GridBoundColumn DataField="Risk_Impact" 
                                                                                                FilterControlAltText="Filter Risk_Impact column" HeaderText="Impact" 
                                                                                                SortExpression="Risk_Impact" UniqueName="Risk_Impact">
                                                                                            </telerik:GridBoundColumn>
                                                                                            <telerik:GridBoundColumn DataField="Risk_Likelihood" 
                                                                                                FilterControlAltText="Filter Risk_Likelihood column" HeaderText="Likelihood" 
                                                                                                SortExpression="Risk_Likelihood" UniqueName="Risk_Likelihood">
                                                                                            </telerik:GridBoundColumn>
                                                                                            <telerik:GridBoundColumn DataField="I_Risk_Exposure" 
                                                                                                FilterControlAltText="Filter I_Risk_Exposure column" HeaderText="Inh_Exposure" 
                                                                                                SortExpression="I_Risk_Exposure" UniqueName="I_Risk_Exposure">
                                                                                            </telerik:GridBoundColumn>
                                                                                            <telerik:GridBoundColumn DataField="Perceived_Contr_Eff" 
                                                                                                FilterControlAltText="Filter Perceived_Contr_Eff column" 
                                                                                                HeaderText="Perceived_Contr" SortExpression="Perceived_Contr_Eff" 
                                                                                                UniqueName="Perceived_Contr_Eff">
                                                                                            </telerik:GridBoundColumn>
                                                                                            <telerik:GridBoundColumn DataField="Desired_Contr_Effe" 
                                                                                                FilterControlAltText="Filter Desired_Contr_Effe column" 
                                                                                                HeaderText="Desired_Contr" SortExpression="Desired_Contr_Effe" 
                                                                                                UniqueName="Desired_Contr_Effe">
                                                                                            </telerik:GridBoundColumn>
                                                                                            <telerik:GridBoundColumn DataField="R_Risk_Exposure" 
                                                                                                FilterControlAltText="Filter R_Risk_Exposure column" HeaderText="Res_Exposure" 
                                                                                                SortExpression="R_Risk_Exposure" UniqueName="R_Risk_Exposure">
                                                                                            </telerik:GridBoundColumn>
                                                                                            <telerik:GridBoundColumn DataField="Action_Owner" 
                                                                                                FilterControlAltText="Filter Action_Owner column" HeaderText="Action_Owner" 
                                                                                                SortExpression="Action_Owner" UniqueName="Action_Owner">
                                                                                            </telerik:GridBoundColumn>
                                                                                            <telerik:GridBoundColumn DataField="Due_Date" DataFormatString="{0:yyyy-MM-dd}" 
                                                                                                FilterControlAltText="Filter Due_Date column" HeaderText="Due_Date" 
                                                                                                SortExpression="Due_Date" UniqueName="Due_Date">
                                                                                            </telerik:GridBoundColumn>
                                                                                            <telerik:GridBoundColumn DataField="Action_Status" 
                                                                                                FilterControlAltText="Filter Action_Status column" HeaderText="Action_Status" 
                                                                                                SortExpression="Action_Status" UniqueName="Action_Status">
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
                                                                    </tr>
                                                                    <tr>
                                                                        <td style="width: 148px">
                                                                            <asp:Label ID="Label189" runat="server" Text="Depart Objective"></asp:Label>
                                                                        </td>
                                                                        <td style="width: 207px">
                                                                            <telerik:RadComboBox ID="cboobjective" Runat="server" AllowCustomText="True" 
                                                                                MarkFirstMatch="True" Skin="Sunset" Width="250px">
                                                                            </telerik:RadComboBox>
                                                                        </td>
                                                                        <td style="width: 103px">
                                                                            &nbsp;</td>
                                                                        <td>
                                                                            <asp:Label ID="LBLRISK" runat="server"></asp:Label>
                                                                        </td>
                                                                    </tr>
                                                                    <tr>
                                                                        <td style="width: 148px">
                                                                            <asp:Label ID="Label190" runat="server" Text="Risk Title"></asp:Label>
                                                                        </td>
                                                                        <td>
                                                                            <telerik:RadTextBox ID="txttitle" Runat="server" Width="250px">
                                                                            </telerik:RadTextBox>
                                                                        </td>
                                                                        <td style="width: 103px">
                                                                            &nbsp;</td>
                                                                        <td>
                                                                            &nbsp;</td>
                                                                    </tr>
                                                                    <tr>
                                                                        <td style="width: 148px">
                                                                            <asp:Label ID="Label191" runat="server" Text="Risk category"></asp:Label>
                                                                        </td>
                                                                        <td style="width: 207px">
                                                                            <telerik:RadComboBox ID="cbocategory" Runat="server" AllowCustomText="True" 
                                                                                MarkFirstMatch="True" Skin="Sunset" Width="250px">
                                                                            </telerik:RadComboBox>
                                                                        </td>
                                                                        <td style="width: 103px">
                                                                            &nbsp;</td>
                                                                        <td>
                                                                            &nbsp;</td>
                                                                    </tr>
                                                                    <tr>
                                                                        <td style="width: 148px">
                                                                            <asp:Label ID="Label192" runat="server" Text="Risk Description"></asp:Label>
                                                                        </td>
                                                                        <td colspan="3" rowspan="2">
                                                                            <telerik:RadTextBox ID="txtdescr" Runat="server" Height="50px" Rows="3" 
                                                                                Skin="Sunset" TextMode="MultiLine" Width="500px">
                                                                            </telerik:RadTextBox>
                                                                        </td>
                                                                    </tr>
                                                                    <tr>
                                                                        <td style="width: 148px">
                                                                            &nbsp;</td>
                                                                    </tr>
                                                                    <tr>
                                                                        <td style="width: 148px;">
                                                                            <asp:Label ID="Label194" runat="server" Text="Consequences"></asp:Label>
                                                                        </td>
                                                                        <td colspan="2" rowspan="2">
                                                                            <telerik:RadTextBox ID="txtconseq" Runat="server" Height="100px" Rows="3" 
                                                                                Skin="Sunset" TextMode="MultiLine" Width="500px">
                                                                            </telerik:RadTextBox>
                                                                        </td>
                                                                        <td>
                                                                            &nbsp;</td>
                                                                    </tr>
                                                                    <tr>
                                                                        <td style="height: 7px; width: 148px;">
                                                                        </td>
                                                                        <td style="height: 7px">
                                                                        </td>
                                                                    </tr>
                                                                    <tr>
                                                                        <td colspan="4">
                                                                            &nbsp;</td>
                                                                    </tr>
                                                                    <tr>
                                                                        <td style="width: 148px; ">
                                                                            <asp:Label ID="Label195" runat="server" Text="Impact"></asp:Label>
                                                                        </td>
                                                                        <td style="width: 207px;">
                                                                            <telerik:RadComboBox ID="cboimpact" Runat="server" AllowCustomText="True" 
                                                                                MarkFirstMatch="True" Skin="Sunset" Width="250px">
                                                                            </telerik:RadComboBox>
                                                                        </td>
                                                                        <td style="width: 103px">
                                                                            <asp:Label ID="owner" runat="server"></asp:Label>
                                                                        </td>
                                                                        <td>
                                                                            &nbsp;</td>
                                                                    </tr>
                                                                    <tr>
                                                                        <td style="width: 148px">
                                                                            <asp:Label ID="Label196" runat="server" Text="Likelihood"></asp:Label>
                                                                        </td>
                                                                        <td style="width: 207px">
                                                                            <telerik:RadComboBox ID="cbolikely" Runat="server" AllowCustomText="True" 
                                                                                MarkFirstMatch="True" Skin="Sunset" Width="250px">
                                                                            </telerik:RadComboBox>
                                                                        </td>
                                                                        <td>
                                                                            <asp:Label ID="champion" runat="server"></asp:Label>
                                                                        </td>
                                                                        <td>
                                                                            &nbsp;</td>
                                                                    </tr>
                                                                    <tr>
                                                                        <td style="width: 148px">
                                                                            <asp:Label ID="Label197" runat="server" Text="Inherent exposure"></asp:Label>
                                                                        </td>
                                                                        <td style="width: 207px">
                                                                            <telerik:RadComboBox ID="cboinhe" Runat="server" AllowCustomText="True" 
                                                                                Enabled="False" MarkFirstMatch="True" Skin="Sunset" Width="250px">
                                                                                <Items>
                                                                                    <telerik:RadComboBoxItem runat="server" Owner="cboinhe" />
                                                                                    <telerik:RadComboBoxItem runat="server" Owner="cboinhe" Text="TERMINATION" 
                                                                                        Value="TERMINATION" />
                                                                                    <telerik:RadComboBoxItem runat="server" Owner="cboinhe" Text="OVER-PAYMENT" 
                                                                                        Value="OVER-PAYMENT" />
                                                                                </Items>
                                                                            </telerik:RadComboBox>
                                                                        </td>
                                                                        <td>
                                                                            &nbsp;</td>
                                                                        <td>
                                                                            &nbsp;</td>
                                                                    </tr>
                                                                    <tr>
                                                                        <td style="width: 148px">
                                                                            <asp:Label ID="Label199" runat="server" Text="Perceived control"></asp:Label>
                                                                        </td>
                                                                        <td style="width: 207px">
                                                                            <telerik:RadComboBox ID="cbopercieved" Runat="server" AllowCustomText="True" 
                                                                                MarkFirstMatch="True" Skin="Sunset" Width="250px">
                                                                            </telerik:RadComboBox>
                                                                        </td>
                                                                        <td style="width: 103px">
                                                                            &nbsp;</td>
                                                                        <td>
                                                                            &nbsp;</td>
                                                                    </tr>
                                                                    <tr>
                                                                        <td style="width: 148px">
                                                                            <asp:Label ID="Label200" runat="server" Text="Desired control"></asp:Label>
                                                                        </td>
                                                                        <td style="width: 207px">
                                                                            <telerik:RadComboBox ID="cbodesired" Runat="server" AllowCustomText="True" 
                                                                                MarkFirstMatch="True" Skin="Sunset" Width="250px">
                                                                            </telerik:RadComboBox>
                                                                        </td>
                                                                        <td>
                                                                            &nbsp;</td>
                                                                        <td>
                                                                            &nbsp;</td>
                                                                    </tr>
                                                                    <tr>
                                                                        <td style="width: 148px">
                                                                            <asp:Label ID="Label201" runat="server" Text="Residual exposure"></asp:Label>
                                                                        </td>
                                                                        <td style="width: 207px">
                                                                            <telerik:RadComboBox ID="cboResidual" Runat="server" AllowCustomText="True" 
                                                                                Enabled="False" MarkFirstMatch="True" Skin="Sunset" Width="250px">
                                                                                <Items>
                                                                                    <telerik:RadComboBoxItem runat="server" Owner="cboResidual" />
                                                                                    <telerik:RadComboBoxItem runat="server" Owner="cboResidual" Text="TERMINATION" 
                                                                                        Value="TERMINATION" />
                                                                                    <telerik:RadComboBoxItem runat="server" Owner="cboResidual" Text="OVER-PAYMENT" 
                                                                                        Value="OVER-PAYMENT" />
                                                                                </Items>
                                                                            </telerik:RadComboBox>
                                                                        </td>
                                                                        <td>
                                                                            &nbsp;</td>
                                                                        <td>
                                                                            &nbsp;</td>
                                                                    </tr>
                                                                    <tr>
                                                                        <td style="width: 148px">
                                                                            <asp:Label ID="Label203" runat="server" Text="Due date"></asp:Label>
                                                                        </td>
                                                                        <td style="width: 207px">
                                                                            <telerik:RadDatePicker ID="dtduedate" Runat="server" MinDate="" Skin="Sunset">
                                                                                <Calendar Skin="Sunset" UseColumnHeadersAsSelectors="False" 
                                                                                    UseRowHeadersAsSelectors="False" ViewSelectorText="x">
                                                                                </Calendar>
                                                                                <DateInput DateFormat="dd/MM/yyyy" DisplayDateFormat="dd/MM/yyyy">
                                                                                </DateInput>
                                                                                <DatePopupButton HoverImageUrl="" ImageUrl="" />
                                                                            </telerik:RadDatePicker>
                                                                        </td>
                                                                        <td style="width: 103px">
                                                                            &nbsp;</td>
                                                                        <td>
                                                                            &nbsp;</td>
                                                                    </tr>
                                                                    <tr>
                                                                        <td style="width: 148px">
                                                                            &nbsp;</td>
                                                                        <td style="width: 207px">
                                                                            <asp:CheckBox ID="chkactive" runat="server" Text="Is Active" />
                                                                        </td>
                                                                        <td style="width: 103px">
                                                                            &nbsp;</td>
                                                                        <td>
                                                                            &nbsp;</td>
                                                                    </tr>
                                                                    <tr>
                                                                        <td colspan="4">
                                                                            <asp:Panel ID="Panel27" runat="server" Height="100%" ScrollBars="Both" 
                                                                                Width="1142px">
                                                                                <telerik:RadGrid ID="GD_RISK_ROOT" runat="server" AllowPaging="True" 
                                                                                    CellSpacing="0" GridLines="None" Height="100%" PageSize="50" Skin="Simple" 
                                                                                    Width="100%">
                                                                                    <MasterTableView AutoGenerateColumns="False" DataKeyNames="Root_ID">
                                                                                        <CommandItemSettings ExportToPdfText="Export to PDF" />
                                                                                        <CommandItemSettings ExportToPdfText="Export to PDF" />
                                                                                        <RowIndicatorColumn FilterControlAltText="Filter RowIndicator column">
                                                                                            <HeaderStyle Width="20px" />
                                                                                        </RowIndicatorColumn>
                                                                                        <ExpandCollapseColumn FilterControlAltText="Filter ExpandColumn column">
                                                                                            <HeaderStyle Width="20px" />
                                                                                        </ExpandCollapseColumn>
                                                                                        <Columns>
                                                                                            <telerik:GridBoundColumn DataField="Root_Cause" 
                                                                                                FilterControlAltText="Filter Root_Cause column" HeaderText="Root_Cause" 
                                                                                                SortExpression="Root_Cause" UniqueName="Root_Cause">
                                                                                            </telerik:GridBoundColumn>
                                                                                            <telerik:GridBoundColumn DataField="Current_Contr" 
                                                                                                FilterControlAltText="Filter Current_Contr column" HeaderText="Current_Control" 
                                                                                                SortExpression="Current_Contr" UniqueName="Current_Contr">
                                                                                            </telerik:GridBoundColumn>
                                                                                            <telerik:GridBoundColumn DataField="Mitigations" 
                                                                                                FilterControlAltText="Filter Mitigations column" HeaderText="Mitigations" 
                                                                                                SortExpression="Mitigations" UniqueName="Mitigations">
                                                                                            </telerik:GridBoundColumn>
                                                                                            <telerik:GridBoundColumn DataField="Due_Date" 
                                                                                                FilterControlAltText="Filter Due_Date  column" HeaderText="Due_Date" 
                                                                                                SortExpression="Due_Date" UniqueName="Due_Date">
                                                                                            </telerik:GridBoundColumn>
                                                                                            <telerik:GridBoundColumn DataField="Action_Owner" 
                                                                                                FilterControlAltText="Filter Action_Owner column" HeaderText="Action_Owner" 
                                                                                                SortExpression="Action_Owner" UniqueName="Action_Owner">
                                                                                            </telerik:GridBoundColumn>
                                                                                            <telerik:GridBoundColumn DataField="Action_Status" 
                                                                                                FilterControlAltText="Filter Action_Status column" HeaderText="Action_Status" 
                                                                                                SortExpression="Action_Status" UniqueName="Action_Status">
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
                                                                    </tr>
                                                                </table>
                                                            </asp:Panel>
                                                        </telerik:RadPageView>
                                                         <telerik:RadPageView ID="V2" runat="server" Width="1136px">
                                                             <asp:Panel ID="Panel21" runat="server">
                                                                 <table style="width: 100%">
                                                                     <tr>
                                                                         <td bgcolor="#666666" style="height: 28px;">
                                                                             <asp:Label ID="Label207" runat="server" Text="Risk Processing" 
                                                                                 Font-Size="Medium" style="font-weight: 700"></asp:Label>
                                                                         </td>
                                                                     </tr>
                                                                     <tr>
                                                                         <td style="height: 39px;">
                                                                             <telerik:RadButton ID="btnsave" runat="server" Skin="Simple" Text="Process" 
                                                                                 Width="146px">
                                                                             </telerik:RadButton>
                                                                             &nbsp;<asp:Label ID="lblprocess" runat="server" Font-Bold="True" Font-Size="Medium" 
                                                                                 ForeColor="Red"></asp:Label>
                                                                         </td>
                                                                     </tr>
                                                                     <tr>
                                                                         <td>
                                                                             <asp:Panel ID="Panel22" runat="server" Height="100%" ScrollBars="Both" 
                                                                                 Width="1142px">
                                                                                 <telerik:RadGrid ID="GD_RISK_SUM" runat="server" AllowPaging="True" 
                                                                                     CellSpacing="0" GridLines="None" Height="100%" Skin="Simple" 
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
                                                                                             
                                                                                             <telerik:GridBoundColumn DataField="Title_Reference" 
                                                                                                 FilterControlAltText="Filter Title_Reference column" 
                                                                                                 HeaderText="Title_Reference" SortExpression="Title_Reference" 
                                                                                                 UniqueName="Title_Reference">
                                                                                             </telerik:GridBoundColumn>
                                                                                             <telerik:GridBoundColumn DataField="Impact" 
                                                                                                 FilterControlAltText="Filter Impact column" HeaderText="Impact" 
                                                                                                 SortExpression="Impact" UniqueName="Impact">
                                                                                             </telerik:GridBoundColumn>
                                                                                             <telerik:GridBoundColumn DataField="Likelihood" 
                                                                                                 FilterControlAltText="Filter Likelihood column" HeaderText="Likelihood" 
                                                                                                 SortExpression="Likelihood" UniqueName="Likelihood">
                                                                                             </telerik:GridBoundColumn>
                                                                                             <telerik:GridBoundColumn DataField="Inh_Risk_Exposure" 
                                                                                                 FilterControlAltText="Filter Inh_Risk_Exposure column" 
                                                                                                 HeaderText="Inh_Risk_Exposure" SortExpression="Inh_Risk_Exposure" 
                                                                                                 UniqueName="Inh_Risk_Exposure">
                                                                                             </telerik:GridBoundColumn>
                                                                                             <telerik:GridBoundColumn DataField="Control_Eff" 
                                                                                                 FilterControlAltText="Filter Control_Eff  column" HeaderText="Control_Eff" 
                                                                                                 SortExpression="Control_Eff" UniqueName="Control_Eff">
                                                                                             </telerik:GridBoundColumn>
                                                                                             <telerik:GridBoundColumn DataField="R_Risk_Exposure" 
                                                                                                 FilterControlAltText="Filter R_Risk_Exposure column" 
                                                                                                 HeaderText="R_Risk_Exposure" SortExpression="R_Risk_Exposure" 
                                                                                                 UniqueName="R_Risk_Exposure">
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
                                                                     </tr>
                                                                 </table>
                                                             </asp:Panel>
                                                        </telerik:RadPageView>
                                                         <telerik:RadPageView ID="V3" runat="server" Width="1136px">
                                                             <asp:Panel ID="Panel23" runat="server">
                                                                 <table style="width: 100%">
                                                                     <tr>
                                                                         <td bgcolor="#666666">
                                                                             <asp:Label ID="Label208" runat="server" style="font-weight: 700" 
                                                                                 Text="RISK SUMMARY-TOP 10" Font-Size="Small"></asp:Label>
                                                                         </td>
                                                                     </tr>
                                                                     <tr>
                                                                         <td>
                                                                             <asp:Panel ID="Panel26" runat="server" Height="100%" ScrollBars="Both" 
                                                                                 Width="1142px">
                                                                                 <telerik:RadGrid ID="GD_RISK_SUM1" runat="server" AllowPaging="True" 
                                                                                     CellSpacing="0" GridLines="None" Height="100%" PageSize="50" Skin="Simple" 
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
                                                                                             <telerik:GridBoundColumn DataField="Risk_Title" 
                                                                                                 FilterControlAltText="Filter Risk_Title column" HeaderText="Risk_Title" 
                                                                                                 SortExpression="Risk_Title" UniqueName="Risk_Title">
                                                                                             </telerik:GridBoundColumn>
                                                                                             <telerik:GridBoundColumn DataField="Risk_Descr" 
                                                                                                 FilterControlAltText="Filter Risk_Descr column" HeaderText="Risk_Descr" 
                                                                                                 SortExpression="Risk_Descr" UniqueName="Risk_Descr">
                                                                                             </telerik:GridBoundColumn>
                                                                                             <telerik:GridBoundColumn DataField="Root_Cause" 
                                                                                                 FilterControlAltText="Filter Root_Cause column" HeaderText="Root_Cause" 
                                                                                                 SortExpression="Root_Cause" UniqueName="Root_Cause">
                                                                                             </telerik:GridBoundColumn>
                                                                                             <telerik:GridBoundColumn DataField="Risk_Conseq" 
                                                                                                 FilterControlAltText="Filter Risk_Conseq column" HeaderText="Risk_Conseq" 
                                                                                                 SortExpression="Risk_Conseq" UniqueName="Risk_Conseq">
                                                                                             </telerik:GridBoundColumn>
                                                                                             <telerik:GridBoundColumn DataField="Risk_Conseq" 
                                                                                                 FilterControlAltText="Filter Risk_Conseq column" HeaderText="Risk_Conseq" 
                                                                                                 SortExpression="Risk_Conseq" UniqueName="Risk_Conseq">
                                                                                             </telerik:GridBoundColumn>
                                                                                             <telerik:GridBoundColumn DataField="Inh_Risk_Exposure" 
                                                                                                 FilterControlAltText="Filter Inh_Risk_Exposure column" 
                                                                                                 HeaderText="Inh_Risk_Exposure" SortExpression="Inh_Risk_Exposure" 
                                                                                                 UniqueName="Inh_Risk_Exposure">
                                                                                             </telerik:GridBoundColumn>
                                                                                             <telerik:GridBoundColumn DataField="Control_Eff" 
                                                                                                 FilterControlAltText="Filter Control_Eff  column" HeaderText="Control_Eff" 
                                                                                                 SortExpression="Control_Eff" UniqueName="Control_Eff">
                                                                                             </telerik:GridBoundColumn>
                                                                                             <telerik:GridBoundColumn DataField="R_Risk_Exposure" 
                                                                                                 FilterControlAltText="Filter R_Risk_Exposure column" 
                                                                                                 HeaderText="R_Risk_Exposure" SortExpression="R_Risk_Exposure" 
                                                                                                 UniqueName="R_Risk_Exposure">
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
                                                                     </tr>
                                                                 </table>
                                                             </asp:Panel>
                                                        </telerik:RadPageView>
                                                    </telerik:RadMultiPage>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                                <tr>
                                    <td>
                                        <table style="width: 100%">
                                            <tr>
                                                <td align="center" bgcolor="#666666">
                                                    &nbsp;</td>
                                            </tr>
                                            <tr>
                                                <td align="center">
                                                    <asp:Label ID="Label184" runat="server" Text="Signoff"></asp:Label>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td align="center">
                                                    <telerik:RadComboBox ID="cbocompl" Runat="server" Skin="Sunset" Width="200px">
                                                        <Items>
                                                            <telerik:RadComboBoxItem runat="server" />
                                                            <telerik:RadComboBoxItem runat="server" Text="Signoff" Value="S" />
                                                            <telerik:RadComboBoxItem runat="server" Owner="cbocompl" Text="Return -Champion" 
                                                                Value="RC" />
                                                            <telerik:RadComboBoxItem runat="server" Text="Return-Manager" Value="RM" />
                                                        </Items>
                                                    </telerik:RadComboBox>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td align="center">
                                                    <telerik:RadTextBox ID="txtnotes" Runat="server" Height="50px" Rows="3" 
                                                        Skin="Sunset" TextMode="MultiLine" Width="500px">
                                                    </telerik:RadTextBox>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td align="center">
                                                    <telerik:RadButton ID="RadButton1" runat="server" Skin="Simple" 
                                                        style="font-weight: 700" Text="Submit" Width="150px">
                                                    </telerik:RadButton>
                                                    &nbsp;
                                                    <asp:Label ID="lblsubmit" runat="server" Font-Bold="True" Font-Size="Medium" 
                                                        ForeColor="Red"></asp:Label>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td align="center">
                                                    &nbsp;</td>
                                            </tr>
                                            <tr>
                                                <td align="center">
                                                    <asp:Label ID="Label186" runat="server" Text="Notes"></asp:Label>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td align="center">
                                                    <asp:Panel ID="Panel15" runat="server" Height="100%" ScrollBars="Both" 
                                                        Width="98%">
                                                        <telerik:RadGrid ID="GDNOTES" runat="server" AllowPaging="True" CellSpacing="0" 
                                                            GridLines="None" Height="100%" Skin="Sunset" Width="100%">
                                                            <MasterTableView AutoGenerateColumns="False">
                                                                <CommandItemSettings ExportToPdfText="Export to PDF" />
                                                                <RowIndicatorColumn FilterControlAltText="Filter RowIndicator column">
                                                                </RowIndicatorColumn>
                                                                <ExpandCollapseColumn FilterControlAltText="Filter ExpandColumn column">
                                                                </ExpandCollapseColumn>
                                                                <Columns>
                                                                    <telerik:GridBoundColumn DataField="Note_date" 
                                                                        FilterControlAltText="Filter Note_date column" HeaderText="Note date" 
                                                                        ItemStyle-Width="100" SortExpression="Note_date" UniqueName="Note_date">
                                                                        <ItemStyle Width="100px" />
                                                                    </telerik:GridBoundColumn>
                                                                    <telerik:GridBoundColumn DataField="Risk_Code" 
                                                                        FilterControlAltText="Filter Risk_Code column" HeaderText="File Risk_Code" 
                                                                        ItemStyle-Width="50" SortExpression="Risk_Code" UniqueName="Risk_Code">
                                                                        <ItemStyle Width="50px" />
                                                                    </telerik:GridBoundColumn>
                                                                    <telerik:GridBoundColumn DataField="Notes_by" 
                                                                        FilterControlAltText="Filter Notes_by column" HeaderText="From" 
                                                                        ItemStyle-Width="100" SortExpression="Notes_by" UniqueName="Notes_by">
                                                                        <ItemStyle Width="100px" />
                                                                    </telerik:GridBoundColumn>
                                                                    <telerik:GridBoundColumn DataField="Notes" 
                                                                        FilterControlAltText="Filter Notes column" HeaderText="Notes" 
                                                                        SortExpression="Notes" UniqueName="Notes">
                                                                    </telerik:GridBoundColumn>
                                                                </Columns>
                                                                <EditFormSettings>
                                                                    <EditColumn FilterControlAltText="Filter EditCommandColumn column">
                                                                    </EditColumn>
                                                                </EditFormSettings>
                                                            </MasterTableView>
                                                            <ItemStyle Wrap="False" />
                                                            <FilterMenu EnableImageSprites="False">
                                                            </FilterMenu>
                                                            <HeaderContextMenu CssClass="GridContextMenu GridContextMenu_Default">
                                                            </HeaderContextMenu>
                                                        </telerik:RadGrid>
                                                    </asp:Panel>
                                                </td>
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

