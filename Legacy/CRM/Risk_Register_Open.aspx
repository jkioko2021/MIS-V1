<%@ Page Title="" Language="VB" MasterPageFile="~/MasterPage.master" AutoEventWireup="false" CodeFile="Risk_Register_Open.aspx.vb" Inherits="_Default" %>


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
                            Height="100%" Width="1170px">
                            <table style="1100: ;">
                                <tr>
                                    <td align="center" bgcolor="#CCCCCC">
                                        <asp:Label ID="Label135" runat="server" Font-Bold="True" 
                                            Text="RISK ACTIVATION" Font-Size="Medium"></asp:Label>
                                    </td>
                                </tr>
                                <tr>
                                    <td align="center">
                                        <table style="width: 1157px">
                                            <tr>
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
                                                <td style="width: 128px">
                                                    <asp:Label ID="Label182" runat="server" Text="Period From"></asp:Label>
                                                </td>
                                                <td style="width: 120px" colspan="2">
                                                    <telerik:RadComboBox ID="cbofrom" Runat="server" AutoPostBack="True" 
                                                        Skin="Sunset" Width="200px">
                                                    </telerik:RadComboBox>
                                                </td>
                                                <td style="width: 127px">
                                                    <asp:Label ID="Label183" runat="server" Text="Period To"></asp:Label>
                                                </td>
                                                <td style="width: 133px">
                                                    <telerik:RadComboBox ID="cboto" Runat="server" Skin="Sunset" Width="200px">
                                                    </telerik:RadComboBox>
                                                </td>
                                                <td style="width: 100px" colspan="2">
                                                    &nbsp;</td>
                                                <td>
                                                    &nbsp;</td>
                                            </tr>
                                            <tr>
                                                <td colspan="8">
                                                    <asp:Panel ID="Panel12" runat="server" Height="100%" ScrollBars="Both" 
                                                        Width="1142px">
                                                        <telerik:RadGrid ID="GDDEPART" runat="server" AllowPaging="True" 
                                                            CellSpacing="0" GridLines="None" Height="100%" PageSize="20" Skin="Simple" 
                                                            Width="100%">
                                                            <MasterTableView AutoGenerateColumns="False" DataKeyNames="Depart_Code">
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
                                            </tr>
                                            <tr>
                                                <td colspan="8">
                                                    <asp:Panel ID="Panel17" runat="server" Height="100%" ScrollBars="Both" 
                                                        Width="1142px">
                                                        <telerik:RadGrid ID="GD_RISK" runat="server" AllowPaging="True" CellSpacing="0" 
                                                            GridLines="None" Height="100%" PageSize="200" Skin="Simple" Width="100%">
                                                            <MasterTableView AutoGenerateColumns="False" DataKeyNames="Risk_Id">
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
                                                                        FilterControlAltText="Filter POLICY_CODE column" HeaderText="Select" 
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
                                                <td colspan="8">
                                                    <asp:Panel ID="Panel19" runat="server">
                                                        <table style="width: 100%">
                                                            <tr>
                                                                <td colspan="4">
                                                                    <telerik:RadTabStrip ID="RadTabStrip1" runat="server" 
                                                                        MultiPageID="RadMultiPage1" SelectedIndex="3">
                                                                        <Tabs>
                                                                            <telerik:RadTab runat="server" PageViewID="V1" Text="Risk Details">
                                                                            </telerik:RadTab>
                                                                            <telerik:RadTab runat="server" PageViewID="V3" Text="Inherent Risk">
                                                                            </telerik:RadTab>
                                                                            <telerik:RadTab runat="server" PageViewID="V4" Text="Residual Risk">
                                                                            </telerik:RadTab>
                                                                            <telerik:RadTab runat="server" PageViewID="V2" Selected="True" 
                                                                                Text="Root Cause">
                                                                            </telerik:RadTab>
                                                                        </Tabs>
                                                                    </telerik:RadTabStrip>
                                                                </td>
                                                            </tr>
                                                            <tr>
                                                                <td colspan="4">
                                                                    <telerik:RadMultiPage ID="RadMultiPage1" Runat="server" Width="100%">
                                                                        <telerik:RadPageView ID="V1" runat="server">
                                                                            <asp:Panel ID="Panel23" runat="server">
                                                                                <table style="width: 100%">
                                                                                    <tr>
                                                                                        <td colspan="4">
                                                                                            <asp:Label ID="Label193" runat="server" Font-Bold="True" Text="RISK DETAILS"></asp:Label>
                                                                                        </td>
                                                                                    </tr>
                                                                                    <tr>
                                                                                        <td class="style17" style="width: 372px">
                                                                                            <asp:Label ID="Label164" runat="server" Text="Depart Objective"></asp:Label>
                                                                                        </td>
                                                                                        <td style="width: 72%">
                                                                                            <telerik:RadComboBox ID="cboobjective" Runat="server" AllowCustomText="True" 
                                                                                                MarkFirstMatch="True" Skin="Sunset" Width="250px">
                                                                                            </telerik:RadComboBox>
                                                                                        </td>
                                                                                        <td style="width: 3%">
                                                                                            <asp:Label ID="LBLRISK" runat="server"></asp:Label>
                                                                                        </td>
                                                                                        <td style="width: 3%">
                                                                                            &nbsp;</td>
                                                                                    </tr>
                                                                                    <tr>
                                                                                        <td class="style17" style="width: 372px">
                                                                                            <asp:Label ID="Label166" runat="server" Text="Risk category"></asp:Label>
                                                                                        </td>
                                                                                        <td style="width: 72%">
                                                                                            <telerik:RadComboBox ID="cbocategory" Runat="server" AllowCustomText="True" 
                                                                                                MarkFirstMatch="True" Skin="Sunset" Width="250px">
                                                                                            </telerik:RadComboBox>
                                                                                        </td>
                                                                                        <td style="width: 3%">
                                                                                            &nbsp;</td>
                                                                                        <td style="width: 3%">
                                                                                            &nbsp;</td>
                                                                                    </tr>
                                                                                    <tr>
                                                                                        <td class="style17" style="width: 372px">
                                                                                            <asp:Label ID="Label196" runat="server" Text="Risk Title"></asp:Label>
                                                                                        </td>
                                                                                        <td style="width: 72%">
                                                                                            <telerik:RadTextBox ID="txttitle" Runat="server" Width="400px">
                                                                                            </telerik:RadTextBox>
                                                                                        </td>
                                                                                        <td style="width: 3%">
                                                                                            &nbsp;</td>
                                                                                        <td style="width: 3%">
                                                                                            &nbsp;</td>
                                                                                    </tr>
                                                                                    <tr>
                                                                                        <td class="style17" style="width: 372px">
                                                                                            <asp:Label ID="Label167" runat="server" Text="Risk Description"></asp:Label>
                                                                                        </td>
                                                                                        <td rowspan="2" style="width: 72%">
                                                                                            <telerik:RadTextBox ID="txtdescr" Runat="server" Height="70px" Rows="3" 
                                                                                                Skin="Sunset" TextMode="MultiLine" Width="400px">
                                                                                            </telerik:RadTextBox>
                                                                                        </td>
                                                                                        <td style="width: 3%">
                                                                                            &nbsp;</td>
                                                                                        <td style="width: 3%">
                                                                                            &nbsp;</td>
                                                                                    </tr>
                                                                                    <tr>
                                                                                        <td class="style17" style="width: 372px">
                                                                                            &nbsp;</td>
                                                                                        <td style="width: 3%">
                                                                                            &nbsp;</td>
                                                                                        <td style="width: 3%">
                                                                                            &nbsp;</td>
                                                                                    </tr>
                                                                                    <tr>
                                                                                        <td class="style17" style="width: 372px">
                                                                                            <asp:Label ID="Label169" runat="server" Text="Consequences"></asp:Label>
                                                                                        </td>
                                                                                        <td rowspan="2" style="width: 72%">
                                                                                            <telerik:RadTextBox ID="txtconseq" Runat="server" Height="50px" Rows="3" 
                                                                                                Skin="Sunset" TextMode="MultiLine" Width="400px">
                                                                                            </telerik:RadTextBox>
                                                                                        </td>
                                                                                        <td style="width: 3%">
                                                                                            &nbsp;</td>
                                                                                        <td style="width: 3%">
                                                                                            &nbsp;</td>
                                                                                    </tr>
                                                                                    <tr>
                                                                                        <td class="style17" style="width: 372px">
                                                                                            &nbsp;</td>
                                                                                        <td style="width: 3%">
                                                                                            &nbsp;</td>
                                                                                        <td style="width: 3%">
                                                                                            &nbsp;</td>
                                                                                    </tr>
                                                                                    <tr>
                                                                                        <td class="style17" style="width: 372px">
                                                                                            &nbsp;</td>
                                                                                        <td style="width: 72%">
                                                                                            <asp:CheckBox ID="chkactive" runat="server" Text="Is Active" />
                                                                                        </td>
                                                                                        <td style="width: 3%">
                                                                                            &nbsp;</td>
                                                                                        <td style="width: 3%">
                                                                                            &nbsp;</td>
                                                                                    </tr>
                                                                                </table>
                                                                            </asp:Panel>
                                                                        </telerik:RadPageView>
                                                                        <telerik:RadPageView ID="V2" runat="server">
                                                                            <asp:Panel ID="Panel2" runat="server">
                                                                                <table style="width: 100%">
                                                                                    <tr>
                                                                                        <td colspan="4">
                                                                                            <asp:Label ID="Label197" runat="server" Font-Bold="True" Text="ROOT CAUSE"></asp:Label>
                                                                                        </td>
                                                                                    </tr>
                                                                                    <tr>
                                                                                        <td style="width: 129px">
                                                                                            <asp:Label ID="Label168" runat="server" Text="Root cause"></asp:Label>
                                                                                        </td>
                                                                                        <td colspan="2" rowspan="2">
                                                                                            <telerik:RadTextBox ID="txtroot" Runat="server" Height="50px" Rows="3" 
                                                                                                Skin="Sunset" TextMode="MultiLine" Width="400px">
                                                                                            </telerik:RadTextBox>
                                                                                        </td>
                                                                                        <td>
                                                                                            &nbsp;</td>
                                                                                    </tr>
                                                                                    <tr>
                                                                                        <td style="width: 129px">
                                                                                            &nbsp;</td>
                                                                                        <td>
                                                                                            &nbsp;</td>
                                                                                    </tr>
                                                                                    <tr>
                                                                                        <td style="width: 129px">
                                                                                            <asp:Label ID="Label173" runat="server" Text="Current Controls"></asp:Label>
                                                                                        </td>
                                                                                        <td rowspan="2">
                                                                                            <telerik:RadTextBox ID="txtcurrcont" Runat="server" Height="50px" Rows="3" 
                                                                                                Skin="Sunset" TextMode="MultiLine" Width="400px">
                                                                                            </telerik:RadTextBox>
                                                                                        </td>
                                                                                        <td>
                                                                                            &nbsp;</td>
                                                                                        <td>
                                                                                            &nbsp;</td>
                                                                                    </tr>
                                                                                    <tr>
                                                                                        <td style="width: 129px">
                                                                                            &nbsp;</td>
                                                                                        <td>
                                                                                            &nbsp;</td>
                                                                                        <td>
                                                                                            &nbsp;</td>
                                                                                    </tr>
                                                                                    <tr>
                                                                                        <td style="width: 129px">
                                                                                            <asp:Label ID="Label177" runat="server" Text="Mitigating action"></asp:Label>
                                                                                        </td>
                                                                                        <td rowspan="2">
                                                                                            <telerik:RadTextBox ID="txtmitigation" Runat="server" Height="50px" Rows="3" 
                                                                                                Skin="Sunset" TextMode="MultiLine" Width="400px">
                                                                                            </telerik:RadTextBox>
                                                                                        </td>
                                                                                        <td>
                                                                                            &nbsp;</td>
                                                                                        <td>
                                                                                            &nbsp;</td>
                                                                                    </tr>
                                                                                    <tr>
                                                                                        <td style="width: 129px">
                                                                                            &nbsp;</td>
                                                                                        <td>
                                                                                            &nbsp;</td>
                                                                                        <td>
                                                                                            &nbsp;</td>
                                                                                    </tr>
                                                                                    <tr>
                                                                                        <td style="width: 129px">
                                                                                            <asp:Label ID="Label178" runat="server" Text="Due date"></asp:Label>
                                                                                        </td>
                                                                                        <td>
                                                                                            <telerik:RadDatePicker ID="dtduedate0" Runat="server" Height="24px" MinDate="" 
                                                                                                Skin="Sunset">
                                                                                                <Calendar Skin="Sunset" UseColumnHeadersAsSelectors="False" 
                                                                                                    UseRowHeadersAsSelectors="False" ViewSelectorText="x">
                                                                                                </Calendar>
                                                                                                <DateInput DateFormat="dd/MM/yyyy" DisplayDateFormat="dd/MM/yyyy" Height="24px">
                                                                                                </DateInput>
                                                                                                <DatePopupButton HoverImageUrl="" ImageUrl="" />
                                                                                            </telerik:RadDatePicker>
                                                                                        </td>
                                                                                        <td>
                                                                                            &nbsp;</td>
                                                                                        <td>
                                                                                            &nbsp;</td>
                                                                                    </tr>
                                                                                    <tr>
                                                                                        <td style="width: 129px">
                                                                                            <asp:Label ID="Label180" runat="server" Text="Action owner"></asp:Label>
                                                                                        </td>
                                                                                        <td>
                                                                                            <telerik:RadTextBox ID="txtowner0" Runat="server" Width="225px">
                                                                                            </telerik:RadTextBox>
                                                                                        </td>
                                                                                        <td>
                                                                                            &nbsp;</td>
                                                                                        <td>
                                                                                            &nbsp;</td>
                                                                                    </tr>
                                                                                    <tr>
                                                                                        <td style="width: 129px">
                                                                                            <asp:Label ID="Label181" runat="server" Text="Action Status"></asp:Label>
                                                                                        </td>
                                                                                        <td>
                                                                                            <telerik:RadComboBox ID="cbostatus" Runat="server" Skin="Sunset" Width="250px">
                                                                                            </telerik:RadComboBox>
                                                                                        </td>
                                                                                        <td>
                                                                                            &nbsp;</td>
                                                                                        <td>
                                                                                            &nbsp;</td>
                                                                                    </tr>
                                                                                    <tr>
                                                                                        <td style="width: 129px; height: 29px;">
                                                                                        </td>
                                                                                        <td style="height: 29px">
                                                                                            <telerik:RadButton ID="RadButton2" runat="server" Skin="Simple" Text="Save" 
                                                                                                Width="100px">
                                                                                            </telerik:RadButton>
                                                                                            <asp:Label ID="lblroot" runat="server" Font-Bold="True" Font-Size="Medium" 
                                                                                                ForeColor="Red"></asp:Label>
                                                                                            <asp:HiddenField ID="HiddenField2" runat="server" />
                                                                                        </td>
                                                                                        <td style="height: 29px">
                                                                                            <asp:Label ID="rootid" runat="server"></asp:Label>
                                                                                        </td>
                                                                                        <td style="height: 29px">
                                                                                        </td>
                                                                                    </tr>
                                                                                    <tr>
                                                                                        <td colspan="4">
                                                                                            <asp:Panel ID="Panel26" runat="server" Height="100%" ScrollBars="Both" 
                                                                                                Width="1142px">
                                                                                                <telerik:RadGrid ID="GD_RISK_ROOT" runat="server" AllowPaging="True" 
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
                                                                                                          
                                                                                                            <telerik:GridBoundColumn DataField="Root_ID" 
                                                                                                                FilterControlAltText="Filter Root_ID column" HeaderText="Root_ID" 
                                                                                                                SortExpression="Root_ID" UniqueName="Root_ID">
                                                                                                            </telerik:GridBoundColumn>
                                                                                                            <telerik:GridBoundColumn DataField="Risk_Code" 
                                                                                                                FilterControlAltText="Filter Risk_Code column" HeaderText="Risk_Code" 
                                                                                                                SortExpression="Risk_Code" UniqueName="Risk_Code">
                                                                                                            </telerik:GridBoundColumn>
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
                                                                        <telerik:RadPageView ID="V3" runat="server">
                                                                            <asp:Panel ID="Panel3" runat="server">
                                                                                <table style="width: 100%">
                                                                                    <tr>
                                                                                        <td colspan="2">
                                                                                            <asp:Label ID="Label198" runat="server" Text="INHERENT RISK EXPOSURES"></asp:Label>
                                                                                        </td>
                                                                                    </tr>
                                                                                    <tr>
                                                                                        <td style="width: 185px">
                                                                                            <asp:Label ID="Label170" runat="server" Text="Impact"></asp:Label>
                                                                                        </td>
                                                                                        <td>
                                                                                            <telerik:RadComboBox ID="cboimpact" Runat="server" AllowCustomText="True" 
                                                                                                MarkFirstMatch="True" Skin="Sunset" Width="250px">
                                                                                            </telerik:RadComboBox>
                                                                                        </td>
                                                                                    </tr>
                                                                                    <tr>
                                                                                        <td style="width: 185px">
                                                                                            <asp:Label ID="Label171" runat="server" Text="Likelihood"></asp:Label>
                                                                                        </td>
                                                                                        <td>
                                                                                            <telerik:RadComboBox ID="cbolikely" Runat="server" AllowCustomText="True" 
                                                                                                MarkFirstMatch="True" Skin="Sunset" Width="250px">
                                                                                            </telerik:RadComboBox>
                                                                                        </td>
                                                                                    </tr>
                                                                                    <tr>
                                                                                        <td style="width: 185px">
                                                                                            &nbsp;</td>
                                                                                        <td>
                                                                                            &nbsp;</td>
                                                                                    </tr>
                                                                                </table>
                                                                            </asp:Panel>
                                                                        </telerik:RadPageView>
                                                                        <telerik:RadPageView ID="V4" runat="server">
                                                                            <asp:Panel ID="Panel4" runat="server">
                                                                                <table style="width: 100%">
                                                                                    <tr>
                                                                                        <td colspan="2">
                                                                                            <asp:Label ID="Label199" runat="server" Text="INHERENT RISK EXPOSURES"></asp:Label>
                                                                                        </td>
                                                                                    </tr>
                                                                                    <tr>
                                                                                        <td style="width: 184px">
                                                                                            <asp:Label ID="Label174" runat="server" Text="Perceived control"></asp:Label>
                                                                                        </td>
                                                                                        <td>
                                                                                            <telerik:RadComboBox ID="cbopercieved" Runat="server" AllowCustomText="True" 
                                                                                                MarkFirstMatch="True" Skin="Sunset" Width="250px">
                                                                                            </telerik:RadComboBox>
                                                                                        </td>
                                                                                    </tr>
                                                                                    <tr>
                                                                                        <td style="width: 184px">
                                                                                            <asp:Label ID="Label175" runat="server" Text="Desired control"></asp:Label>
                                                                                        </td>
                                                                                        <td>
                                                                                            <telerik:RadComboBox ID="cbodesired" Runat="server" AllowCustomText="True" 
                                                                                                MarkFirstMatch="True" Skin="Sunset" Width="250px">
                                                                                            </telerik:RadComboBox>
                                                                                        </td>
                                                                                    </tr>
                                                                                </table>
                                                                            </asp:Panel>
                                                                        </telerik:RadPageView>
                                                                    </telerik:RadMultiPage>
                                                                </td>
                                                            </tr>
                                                            <tr>
                                                                <td colspan="4">
                                                                    <hr />
                                                                </td>
                                                            </tr>
                                                            <tr>
                                                                <td bgcolor="Gray" colspan="4">
                                                                    &nbsp;</td>
                                                            </tr>
                                                            <tr>
                                                                <td style="width: 102px">
                                                                    <asp:Label ID="Label200" runat="server" Text="Risk Status"></asp:Label>
                                                                </td>
                                                                <td style="width: 281px">
                                                                    <telerik:RadComboBox ID="cboriskstatus" Runat="server" Enabled="False" 
                                                                        Skin="Sunset" Width="250px">
                                                                    </telerik:RadComboBox>
                                                                </td>
                                                                <td style="width: 103px">
                                                                    &nbsp;</td>
                                                                <td>
                                                                    &nbsp;</td>
                                                            </tr>
                                                            <tr>
                                                                <td colspan="4">
                                                                    &nbsp;</td>
                                                            </tr>
                                                            <tr>
                                                                <td colspan="4">
                                                                    <hr />
                                                                </td>
                                                            </tr>
                                                        </table>
                                                    </asp:Panel>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td style="width: 128px">
                                                    <asp:Label ID="Label190" runat="server" Text="Due date"></asp:Label>
                                                </td>
                                                <td colspan="2" style="width: 120px">
                                                    <telerik:RadDatePicker ID="dtduedate" Runat="server" MinDate="" Skin="Web20">
                                                        <Calendar Skin="Sunset" UseColumnHeadersAsSelectors="False" 
                                                            UseRowHeadersAsSelectors="False" ViewSelectorText="x">
                                                        </Calendar>
                                                        <DateInput DateFormat="dd/MM/yyyy" DisplayDateFormat="dd/MM/yyyy">
                                                        </DateInput>
                                                        <DatePopupButton HoverImageUrl="" ImageUrl="" />
                                                    </telerik:RadDatePicker>
                                                </td>
                                                <td style="width: 127px">
                                                    <asp:Label ID="Label188" runat="server" Text="Quarter"></asp:Label>
                                                </td>
                                                <td colspan="4">
                                                    <asp:Label ID="Q" runat="server" Font-Bold="True" Font-Size="Small" 
                                                        style="font-weight: 700; color: #CC0000; background-color: #FFFFFF"></asp:Label>
                                                    <asp:Label ID="status" runat="server" Font-Bold="True" Font-Size="Small" 
                                                        style="font-weight: 700; color: #CC0000; background-color: #FFFFFF"></asp:Label>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td style="width: 128px">
                                                    <asp:Label ID="Label185" runat="server" Text="Champion"></asp:Label>
                                                </td>
                                                <td colspan="2">
                                                    <telerik:RadTextBox ID="txtchamp" Runat="server" Enabled="False" Skin="Simple" 
                                                        Width="225px">
                                                    </telerik:RadTextBox>
                                                </td>
                                                <td>
                                                    &nbsp;</td>
                                                <td colspan="4">
                                                    <asp:Label ID="FILE_NO" runat="server" Font-Bold="True" Font-Size="Small" 
                                                        style="font-weight: 700; color: #CC0000; background-color: #FFFFFF"></asp:Label>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td style="width: 128px">
                                                    <asp:Label ID="Label165" runat="server" Text="Risk Owner"></asp:Label>
                                                </td>
                                                <td colspan="2">
                                                    <telerik:RadTextBox ID="txtowner" Runat="server" Enabled="False" Skin="Simple" 
                                                        Width="225px">
                                                    </telerik:RadTextBox>
                                                </td>
                                                <td style="width: 127px">
                                                    &nbsp;</td>
                                                <td colspan="4">
                                                    &nbsp;</td>
                                            </tr>
                                            <tr>
                                                <td style="width: 128px">
                                                    <asp:Label ID="Label191" runat="server" Text="Period From"></asp:Label>
                                                </td>
                                                <td style="width: 120px" colspan="2">
                                                    <telerik:RadComboBox ID="cbofrom_p" Runat="server" AutoPostBack="True" 
                                                        Skin="Sunset" Width="200px">
                                                    </telerik:RadComboBox>
                                                </td>
                                                <td style="width: 127px">
                                                    &nbsp;</td>
                                                <td colspan="4">
                                                    &nbsp;</td>
                                            </tr>
                                            <tr>
                                                <td style="width: 128px">
                                                    <asp:Label ID="Label192" runat="server" Text="Period To"></asp:Label>
                                                </td>
                                                <td colspan="2" style="width: 120px">
                                                    <telerik:RadComboBox ID="cboto_p" Runat="server" Skin="Sunset" Width="200px">
                                                    </telerik:RadComboBox>
                                                </td>
                                                <td style="width: 127px">
                                                    &nbsp;</td>
                                                <td colspan="4">
                                                    &nbsp;</td>
                                            </tr>
                                            <tr>
                                                <td style="width: 128px">
                                                    <asp:Label ID="Label184" runat="server" Text="Action"></asp:Label>
                                                </td>
                                                <td colspan="2" style="width: 120px">
                                                    <telerik:RadComboBox ID="cboaction" Runat="server" Skin="Sunset" Width="200px">
                                                        <Items>
                                                            <telerik:RadComboBoxItem runat="server" Owner="cboaction" />
                                                            <telerik:RadComboBoxItem runat="server" Owner="cboaction" Text="OPEN" 
                                                                Value="OPEN" />
                                                        </Items>
                                                    </telerik:RadComboBox>
                                                </td>
                                                <td style="width: 127px">
                                                    &nbsp;</td>
                                                <td colspan="4">
                                                    <asp:Label ID="CODE" runat="server" Font-Bold="True" Font-Size="Small"></asp:Label>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td colspan="2" style="height: 40px;">
                                                    &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                                                </td>
                                                <td colspan="2" style="height: 40px;">
                                                    <telerik:RadButton ID="btnsave" runat="server" Height="39px" Skin="Simple" 
                                                        Text="Save" Width="162px">
                                                    </telerik:RadButton>
                                                </td>
                                                <td colspan="2" style="height: 40px;">
                                                    &nbsp;</td>
                                                <td colspan="2" style="height: 40px;">
                                                    &nbsp;</td>
                                            </tr>
                                            <tr>
                                                <td colspan="8">
                                                    <asp:Label ID="lblsave" runat="server" Font-Bold="True" Font-Size="Medium" 
                                                        ForeColor="Red"></asp:Label>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td colspan="8">
                                                    <asp:HiddenField ID="HiddenField1" runat="server" />
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                                <tr>
                                    <td>
                                        <asp:Label ID="Label186" runat="server" Font-Bold="True" Font-Size="Medium" 
                                            Text="OPEN REGISTERS"></asp:Label>
                                    </td>
                                </tr>
                                <tr>
                                    <td>
                                        <asp:Panel ID="Panel13" runat="server" Height="100%" ScrollBars="Both" 
                                            Width="1156px">
                                            <telerik:RadGrid ID="GDOPEN" runat="server" AllowPaging="True" CellSpacing="0" 
                                                GridLines="None" Height="100%" PageSize="20" Skin="Simple" Width="100%">
                                                <MasterTableView AutoGenerateColumns="False" DataKeyNames="ID">
                                                    <CommandItemSettings ExportToPdfText="Export to PDF" />
                                                    <CommandItemSettings ExportToPdfText="Export to PDF" />
                                                    <RowIndicatorColumn FilterControlAltText="Filter RowIndicator column">
                                                        <HeaderStyle Width="20px" />
                                                    </RowIndicatorColumn>
                                                    <ExpandCollapseColumn FilterControlAltText="Filter ExpandColumn column">
                                                        <HeaderStyle Width="20px" />
                                                    </ExpandCollapseColumn>
                                                    <Columns>
                                                     
                                                        <telerik:GridBoundColumn DataField="ID" FilterControlAltText="Filter ID column" 
                                                            HeaderText="ID" SortExpression="ID" UniqueName="ID">
                                                        </telerik:GridBoundColumn>
                                                        <telerik:GridBoundColumn DataField="Period_From" 
                                                            FilterControlAltText="Filter Period_From column" HeaderText="Period_From" 
                                                            SortExpression="Period_From" UniqueName="Period_From">
                                                        </telerik:GridBoundColumn>
                                                        <telerik:GridBoundColumn DataField="Period_To" 
                                                            FilterControlAltText="Filter Period_To column" HeaderText="Period_To" 
                                                            SortExpression="Period_To" UniqueName="Period_To">
                                                        </telerik:GridBoundColumn>
                                                        <telerik:GridBoundColumn DataField="Depart_Code" 
                                                            FilterControlAltText="Filter Depart_Code column" HeaderText="Depart_Code" 
                                                            SortExpression="Depart_Code" UniqueName="Depart_Code">
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
                                </tr>
                                <tr>
                                    <td>
                                        &nbsp;</td>
                                </tr>
                                <tr>
                                    <td>
                                        <asp:Panel ID="Panel15" runat="server" Height="100%" ScrollBars="Both" 
                                            Width="1129px">
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
                        </asp:Panel>
                                        </td>
                                </tr>
                            </table>
   </asp:Panel>
   </div>
            </ContentTemplate>
       
            </asp:UpdatePanel>
</asp:Content>

